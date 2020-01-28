/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.alipay.demo.controller.rest;

import com.alipay.api.AlipayApiException;
import com.alipay.api.AlipayClient;
import com.alipay.api.request.AlipaySystemOauthTokenRequest;
import com.alipay.api.response.AlipaySystemOauthTokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;

/**
 * @author alipay.demo
 *
 */
@Component
public class AlipayUserInfoShareControllerImpl implements AlipayUserInfoShareController{
    private static final Logger logger = LoggerFactory.getLogger(AlipayUserInfoShareControllerImpl.class);

    @Autowired
    private AlipayClient alipayClient;
    @Override
    public Object alipayUserInfo(@Context HttpServletRequest request) throws Exception {
        String authCode = request.getParameter("authCode");
        if (isBlank(authCode)) {
            logger.warn("授权编码不能为空!");
            throw new Exception("授权编码不能为空");
        }
        AlipaySystemOauthTokenResponse alipaySystemOauthTokenResponse = this.getAccessToken(authCode);
        if (!alipaySystemOauthTokenResponse.isSuccess()) {
            logger.warn("换取 AuthToken 失败！错误编码：{}, 错误信息：{}", alipaySystemOauthTokenResponse.getCode(), alipaySystemOauthTokenResponse.getMsg() );
            return alipaySystemOauthTokenResponse;
        }
        return alipaySystemOauthTokenResponse;
    }

    private AlipaySystemOauthTokenResponse getAccessToken(String authCode) throws AlipayApiException {
        AlipaySystemOauthTokenRequest request = new AlipaySystemOauthTokenRequest();
        request.setGrantType("authorization_code");
        request.setCode(authCode);
        request.setRefreshToken("201208134b203fe6c11548bcabd8da5bb087a83b");
        return alipayClient.execute(request);
    }


    public static boolean isBlank(String str) {
        int length;
        if (str != null && (length = str.length()) != 0) {
            for(int i = 0; i < length; ++i) {
                if (!Character.isWhitespace(str.charAt(i))) {
                    return false;
                }
            }

            return true;
        } else {
            return true;
        }
    }
}